import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderPaginationDto, PaymentSucceededDto } from './dto';
import { ICreateOrder } from './interfaces';

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order: ICreateOrder  = await this.ordersService.createOrder(createOrderDto);
    const paymentSession = await this.ordersService.paymentSession(order);
    return paymentSession;
  }

  @MessagePattern('findAllOrders')
  findAll(
    @Payload() orderPagDto: OrderPaginationDto
  ) {
    return this.ordersService.findAll( orderPagDto );
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload() payload: { id: string, eventId: string}) {
    return this.ordersService.findOne(payload);
  }

  @EventPattern('payment.succeeded')
  paidOrder(@Payload() paySucceeded: PaymentSucceededDto) {
    this.ordersService.paidOrder(paySucceeded)
  }
}
