import { UpdateOrderDto } from './dto/update-order.dto';
import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto, PaymentSucceededDto } from './dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { CardEntity } from 'src/common/entities';
import { PaginationDto } from 'src/common';

interface CardWithPrice {
  price: number;
  cards: CardEntity[];
  eventName: string;
}

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Orders-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy
  ) { super() }

  async createOrder(createOrderDto: CreateOrderDto) {
    const compensations = [];
    const { quantity, buyer } = createOrderDto;

    try {
      // Creo las tablas de bingo
      const { price, cards, eventName } = await firstValueFrom<CardWithPrice>(
        this.client.send('createCard', createOrderDto)
      );
      const idsCards = cards.map(card => card.id);
      compensations.push(() => this.client.send('removeCards', idsCards));

      const totalAmount = price * quantity;
      const totalItems = quantity;

      // Creo la orden de pago
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          userId: buyer,
          orderItems: {
            createMany: {
              data: cards.map((orderItem) => ({
                priceUnit: price,
                cardId: orderItem.id,
                quantity: quantity
              })),
            }
          }
        },
        include: {
          orderItems: {
            select: {
              cardId: true,
              quantity: true,
              priceUnit: true,
            }
          }
        }
      });
      compensations.push(() => this.order.delete({where: { id: order.id }}));

      // Creo la sesión de pago
      const payment = {
        orderId: order.id,
        currency: 'usd',
        items: order.orderItems.map( (item) => ({
            name: eventName,
            price: item.priceUnit,
            quantity: item.quantity,
          }))
      };

      const paymentSession = await firstValueFrom(
        this.client.send('create-payment-session', payment)
      );

      return paymentSession;
    } catch (error) {
      for (const compensation of compensations) {
        try{
          await compensation();
        } catch(compError) {
          this.logger.error('Error de compensación: ' + compError);
        }
      }

      this.logger.error('Error al crear la orden: ' +error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al crear la orden, no fue posible crear la orden de pago'
      })
    }
  }

  async updateOrder(orderUpdate: UpdateOrderDto) {
    const { id, ...data } = orderUpdate;
    const order = await this.order.update({
      where: { id },
      data
    });

    if (!order) throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Order with id #${id} not found`
    });

    return order;
  }

  async findAll(orderPagDto: OrderPaginationDto) {
    const totalPages = await this.order.count({
      where: {
        status: orderPagDto.status
      }
    });
    const currentPage = orderPagDto.page;
    const perPage = orderPagDto.limit;

    return {
      data: await this.order.findMany({
        skip: (currentPage - 1) * perPage,
        take: perPage,
        where: {
          status: orderPagDto.status
        }
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil(totalPages / perPage)
      }
    };
  }

  async findOneByUser(userId: string, pagination: PaginationDto) {
    try {
      const { limit, page } = pagination;
      const totalPages = await this.order.count({
        where: { userId }
      });
      const currentPage = page;
      const perPage = limit;

      return {
        data: await this.order.findMany({
          skip: (currentPage - 1) * perPage,
          take: perPage,
          where: {
            userId
          },
          include: {
            orderItems: {
              select: {
                cardId: true,
                priceUnit: true,
                quantity: true
              }
            }
          }
        }),
        meta: {
          total: totalPages,
          page: currentPage,
          lastPage: Math.ceil(totalPages / perPage)
        }
      }
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al obtener las ordenes del usuario',
      })
    }
  }
  
  async findOne(id: string) {
    try {
      const order = await this.order.findFirst({
        where: {
          id: id
        },
        include: {
          orderItems: {
            select: {
              cardId: true,
              priceUnit: true,
              quantity: true
            }
          }
        }
      });

      if (!order) throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `No se encontro la orden con id ${id}`
      });

      return  order;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error al obtener la orden',
      })
    }
  }

  async paidOrder(paySecceeded: PaymentSucceededDto) {
    try {
      // Actualizo la orden
      await this.order.update({
        where: { id: paySecceeded.orderId },
        data: {
          status: 'PAID',
          paid: true,
          paidAt: new Date(),
          stripeChargeId: paySecceeded.stripePaymentId,
          OrderReceipt: {
            create: {
              receiptUrl: paySecceeded.receiptUrl
            }
          }
        },
      });

      const ids = (await this.orderItem.findMany({ where: { orderId: paySecceeded.orderId }})).map(orderItem => orderItem.cardId);
      // Habilito la card
      await firstValueFrom(
        this.client.send('updateAvailableManyCard', {ids})
      );

    } catch(error) {
      this.logger.error('Error al actualizar la orden de pago: ' + {error});
    }
  }
}
