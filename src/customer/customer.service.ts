import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class CustomerService extends PrismaClient implements OnModuleInit {

  onModuleInit() {
    this.$connect();
  }

  constructor(private stripeServ: StripeService) {
    super();
  }

  async create(createCustomerDto: CreateCustomerDto) {
    const customerStripe = await this.stripeServ.createCustomer({ email: createCustomerDto.email, name: createCustomerDto.name });
    const customer = await this.customer.create({ data: { ...createCustomerDto, stripeId: customerStripe.id } });
    return customer;
  }

  async findOne(id: string) {
    const customer = await this.customer.findFirst({
      where: { id: id }
    });

    if (!customer) throw new RpcException({
      status: HttpStatus.NOT_FOUND,
      message: `This customer with id #${id} not found`
    });

    return customer;
  }

  async findByUserId(userId: number) {
    const customer = await this.customer.findFirst({
      where: { userId }
    });

    return customer;
  }
}
