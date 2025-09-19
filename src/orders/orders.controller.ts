import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto, OrderPaginationDto, PaymentSucceededDto } from './dto';
import { PaginationDto } from 'src/common';

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  //* Crear una orden de pago
  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  //* Obtener todas las ordenes de pago
  @MessagePattern('findAllOrders')
  findAll(
    @Payload() orderPagDto: OrderPaginationDto
  ) {
    return this.ordersService.findAll( orderPagDto );
  }

  //* Obtener una orden de pago por ID
  @MessagePattern('findOneOrder')
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }
  
  //* Obtener las ordenes de pago de un usuario
  @MessagePattern('findOneByUser')
  findOneByUser(
    @Payload('userId', ParseUUIDPipe) userId: string,
    @Payload('pagination') pagination: PaginationDto,
  ) {
    return this.ordersService.findOneByUser(userId, pagination);
  }

  //* Evento de escucha de una pago exitoso
  @EventPattern('payment.succeeded')
  paidOrder(@Payload() paySucceeded: PaymentSucceededDto) {
    this.ordersService.paidOrder(paySucceeded)
  }
}
