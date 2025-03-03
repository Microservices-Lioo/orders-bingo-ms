import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { StripeModule } from './stripe/stripe.module';
import { PaymentModule } from './payment/payment.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [OrdersModule, StripeModule, PaymentModule, CustomerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
