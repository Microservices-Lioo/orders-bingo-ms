import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @MessagePattern('createCustomer')
  create(@Payload() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }


  @MessagePattern('findOneCustomer')
  findOne(@Payload() id: string) {
    return this.customerService.findOne(id);
  }
}
