import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { CustomerModule } from 'src/customer/customer.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [CustomerModule, StripeModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
