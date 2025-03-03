import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ConfirmPaymentDto, EventDto, ReturnPaymentDto } from './dto';
import { CreateCustomerDto } from 'src/customer/dto/create-customer.dto';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern('getPayments')
  async getPayments(@Payload() customerId: string) {
    const payments = await this.paymentService.findCustomerPayments(customerId);

    return payments.map((p) => new ReturnPaymentDto(p));
  }

  @MessagePattern('getPayment')
  async getPayment(@Payload() payload: { customerId: string, paymentId: string }) {
    const { customerId, paymentId } = payload;
    const payment = await this.paymentService.findCustomerPayment(customerId, paymentId);

    return new ReturnPaymentDto(payment);
  }

  @MessagePattern('confirmPayment')
  async confirmPayment(@Payload() payload: { userId: number, confirmPaymentDto: ConfirmPaymentDto }) {
    const { userId, confirmPaymentDto } = payload;
    
    const createdPayment = await this.paymentService.confirmPayment(
      userId,
      confirmPaymentDto,
    );

    return new ReturnPaymentDto(createdPayment);
  }

  @MessagePattern('createCheckoutSessionPayment')
  async createCheckoutSession(@Payload() payload: 
    { event: EventDto, cuid: string, quantity: number, customer: CreateCustomerDto }) {
    const { event, cuid, quantity, customer } = payload;
    return this.paymentService.createCheckoutSession(event, cuid, quantity, customer);
  }
}
