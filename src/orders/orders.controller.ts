import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto, CreateOrderItemDto, OrderPaginationDto } from './dto';
import { envs } from 'src/config';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @MessagePattern('createOrderItem')
  createOrderItem(@Payload() createOrderDto: CreateOrderItemDto) {
    this.ordersService.createOrderItem(createOrderDto);
  }

  @MessagePattern('createOrderItemArray')
  createOrderItemArray(@Payload() createOrderDto: CreateOrderItemDto[]) {
    this.ordersService.createOrderItemArray(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll(
    @Payload() orderPagDto: OrderPaginationDto
  ) {
    return this.ordersService.findAll( orderPagDto );
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload() id: number) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern('webhookPayment')
  async webhookStripe(
    @Payload() payload: { secret: string, event: any}
  ) {
    if (payload?.secret !== envs.SECRET_PAYMENT) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: `Not Authorized`
      } );
    }

    return await this.ordersService.webhookStripe(payload);
  }
}
