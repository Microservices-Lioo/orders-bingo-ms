import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EventDto, } from './common/dto';
import { CreateCustomerDto } from 'src/customer/dto/create-customer.dto';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern('createCheckoutSessionPayment')
  async createCheckoutSession(@Payload() payload: 
    { event: EventDto, cuid: string, quantity: number, customer: CreateCustomerDto }) {
    const { event, cuid, quantity, customer } = payload;
    return this.paymentService.createCheckoutSession(event, cuid, quantity, customer);
  }

  @MessagePattern('webhookPayment')
  async webhookStripe(@Payload() event: any ) {
    return await this.paymentService.webhookStripe(event);
  }
}
