import { UpdateOrderDto } from './dto/update-order.dto';
import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto, PaymentSucceededDto } from './dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';
import { CardEntity, EventEntity } from 'src/common/entities';
import { ICreateOrder } from './interfaces';

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
    try {
      const { quantity } = createOrderDto;
      const { price, cards, eventName } = await firstValueFrom<CardWithPrice>(
        this.client.send('createCard', createOrderDto)
      );
      const totalAmount = price * quantity;
      const totalItems = quantity;

      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
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
      })
      return { eventName: eventName, ...order };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message
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
        message: `Order with id #${id} not found`
      });

      return  order;

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      })
    }
  }

  async paymentSession(order: ICreateOrder) {
    try {
      const paymentSession = await firstValueFrom(
        this.client.send('create-payment-session', {
          orderId: order.id,
          currency: "usd",
          items: order.orderItems.map( (item) => ({
            name: order.eventName,
            price: item.priceUnit,
            quantity: item.quantity,
          }))
        })
      );
      return paymentSession;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error in comunicate with payments ms`
      })
    }

  }

  async paidOrder(paySecceeded: PaymentSucceededDto) {
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
    })
  }
}
