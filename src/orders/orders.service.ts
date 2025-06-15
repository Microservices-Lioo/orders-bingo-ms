import { UpdateOrderDto } from './dto/update-order.dto';
import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { StripeService } from 'src/stripe/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  
  private readonly logger = new Logger('Orders-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  constructor(
    private stripeServ: StripeService,
  ) { super() }

  async createOrder(createOrderDto: CreateOrderDto) {
    const { nameEvent, unitAmount, ...data } = createOrderDto;
    const { totalItems } = createOrderDto;    
    
    let totalAmount = Math.round((totalItems * unitAmount) * 100) / 100; // redondeo a dos decimales
    
    const order = await this.order.create({
      data: { 
         totalAmount,
        ...data
      }
    });

    const checkoutSession = await this.stripeServ.createCheckoutSession(createOrderDto, order.id);
    const { url } = checkoutSession;

    return { url };  
  }

  async createOrderItem(createOrderItemDto: CreateOrderItemDto) {
    await this.orderItem.create({
      data: createOrderItemDto
    });
  }

  async createOrderItemArray(createOrderItemDto: CreateOrderItemDto[]) {
    await this.orderItem.createMany({
      data: createOrderItemDto
    });
  }

  async updateOrder(orderUpdate: UpdateOrderDto) {
    const { id, ...data } = orderUpdate;
    const order = await this.order.update({
      where: { id },
      data
    });

    if ( !order ) throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Order with id #${id} not found`
    } );
    
    return order;
  }

  async findAll( orderPagDto: OrderPaginationDto ) {
    const totalPages = await this.order.count({
      where: {
        status: orderPagDto.status
      }
    });
    const currentPage = orderPagDto.page;
    const perPage = orderPagDto.limit;

    return {
      data: await this.order.findMany({
        skip: ( currentPage - 1 ) * perPage,
        take: perPage,
        where: {
          status: orderPagDto.status
        }
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil( totalPages / perPage )
      }
    };
  }

  async findOne(id: number) {
    const order = await this.order.findFirst({
      where: {
        id: id
      }
    });

    if ( !order ) throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `Order with id #${id} not found`
    } );
    
    return order;
  }

  async findBySessionId(id: string) {
    const order = await this.order.findFirst({
      where: {
        sessionId: id
      }
    });

    if ( !order ) {
      return false;
    }
    
    return true;
  }

  async webhookStripe(payload: any) {
    const { event } = payload;
    try {
      switch(event.type) {
        case 'checkout.session.expired':
          console.log('checkout.session.expired');
          break;
        case 'charge.refunded':
          console.log('charge.refunded');
          break;
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          const sessionId = session.id;

          const orderExist = await this.findBySessionId(sessionId);
          if (orderExist) {
            break;
          }

          const orderId = await this.stripeServ.findItemBySessionId(sessionId);
          const order = await this.findOne(orderId);

          // Update order
          const stripePaymentIntentId = session.payment_intent.toString();
          const updateOrder: UpdateOrderDto = { id: order.id, paidAt: new Date(), sessionId, stripePaymentIntentId, paid: true, status: OrderStatus.PAID }
          const newOrder = await this.updateOrder(updateOrder);
          return {
            successfull: true,
            data: newOrder
          };
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        successfull: false,
        error: 'Ocurrio un error processando un evento: ' + error
      });
    }
  }

}
