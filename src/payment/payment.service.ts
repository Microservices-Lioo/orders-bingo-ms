import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CheckoutSS, PaymentStatus, PrismaClient } from '@prisma/client';
import { StripeService } from 'src/stripe/stripe.service';
import { CreatePaymentDto, EventDto, UpdatePayment } from './common/dto';
import { RpcException } from '@nestjs/microservices';
import { CustomerService } from 'src/customer/customer.service';
import { CreateCustomerDto } from 'src/customer/dto/create-customer.dto';

@Injectable()
export class PaymentService extends PrismaClient implements OnModuleInit {
    private readonly logger = new Logger('Payment-Service');

    async onModuleInit() {
        await this.$connect();
    }

    constructor(
        private stripeServ: StripeService,
        private customerServ: CustomerService
    ) { super() }

    async createPayment(createPayment: CreatePaymentDto) {
        try {
            const payment = await this.payment.create({
                data: createPayment
            });
    
            return payment;
        } catch (error) {
            const message = error.message 
                ? error.message 
                : 'An unexpected error occurred while creating the payment.';
            throw new RpcException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: message,
                error: 'create_payment'
            });
        }
    }

    async updatePayment(updatePayment: UpdatePayment) {
        const { id, ...data } = updatePayment;
        try {
            const payment = await this.payment.update({
                where: { id },
                data: data
            });
            return payment;
        } catch (error) {
            const message = error.message 
                ? error.message 
                : 'An unexpected error occurred while updating the payment.';
            throw new RpcException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: message,
                error: 'update_payment'
            });
        }
    }

    async findOne(id: string, userId: number) {
        const payment = await this.payment.findFirst({
            where: { id, userId }
        });

        if (!payment) throw new RpcException({
            status: HttpStatus.NOT_FOUND,
            message: `This payment with id #${id} not found`
        });

        return payment;
    }

    async findById(id: string) {
        const payment = await this.payment.findFirst({
            where: { id }
        });

        if (!payment) throw new RpcException({
            status: HttpStatus.NOT_FOUND,
            message: `This payment with id #${id} not found`
        });

        return payment;
    }

    async findByCheckoutSessionId(checkoutSessionId: string) {
        const payment = await this.payment.findFirst({
            where: { checkoutSessionId: checkoutSessionId }
        });

        return payment;
    }

    getStatusPayment(status: string): PaymentStatus {
        if (status === 'paid') {
            return PaymentStatus.PAID;
        } else {
            return PaymentStatus.UNPAID;
        }
    }


    async createCheckoutSession(
        event: EventDto, 
        cuid: string, 
        quantity: number,
        customer: CreateCustomerDto
    ) {
        const customerExits = await this.customerServ.findByUserId(customer.userId);
        if (!customerExits) {
            const customerCreate = await this.customerServ.create(customer);
            const paymentCheckoutSession = await this.stripeServ.createCheckoutSession(event, cuid, quantity, customerCreate.stripeId)
            const { data, url } = paymentCheckoutSession;
            const payment = await this.returnPaymentObject(data, cuid, quantity, customerCreate.userId, customerCreate.id);
            await this.createPayment(payment);
            return { url };
        } else {
            const paymentCheckoutSession = await this.stripeServ.createCheckoutSession(event, cuid, quantity, customerExits.stripeId)
            const { data, url } = paymentCheckoutSession;
            const payment = await this.returnPaymentObject(data, cuid, quantity, customerExits.userId, customerExits.id);
            await this.createPayment(payment);
            return { url };
        }
    }

    async returnPaymentObject(data: any, cuid: string, quantity: number, userId: number, customerId: string): Promise<CreatePaymentDto> {
        return new CreatePaymentDto(
        {   
            checkoutSessionId: data.id, 
            amount: data.amount_total, 
            currency: data.currency,
            cuid: cuid,
            userId: userId,
            totalItems: quantity,
            customerId: customerId
        });
    }

    async webhookStripe(event: any) {
        switch(event.type) {
            case 'checkout.session.completed':
                const paymentCheckout = event.data.object;
                const cheackoutSession = await this.findByCheckoutSessionId(paymentCheckout.id);
                if (cheackoutSession) {
                    const paymentUpdate = { 
                        id: cheackoutSession.id,
                        paymentStatus: PaymentStatus.PAID,
                        checkoutSessionStatus: CheckoutSS.COMPLETE,
                        paidAt: new Date()
                    }
                    await this.updatePayment(paymentUpdate);
                }                
            break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        return { recived: true };
    }
}
