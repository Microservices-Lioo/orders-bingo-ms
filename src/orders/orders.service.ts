import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  
  private readonly logger = new Logger('Orders-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async create(createOrderDto: CreateOrderDto) {
    return await this.order.create({
      data: createOrderDto
    });
  }

  async findAll( orderPagDto: OrderPaginationDto ) {
    const totalPages = await this.order.count({
      where: {
        status: orderPagDto.status
      }
    });
    console.log('uwu');
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

}
