import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PaymentStatus, PrismaClient } from '@prisma/client';
import { CustomerInterface, UserInterface } from 'src/common/interfaces';
import { StripeService } from 'src/stripe/stripe.service';
import { ConfirmPaymentDto, CreatePaymentDto, EventDto } from './dto';
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
        const payment = await this.payment.create({
            data: createPayment
        });

        return payment;
    }

    async confirmPayment(userId: number, confirmPaymentDto: ConfirmPaymentDto) {
        await this.assertUserOwnsPayment(userId, confirmPaymentDto.paymentId);

        const payment = await this.stripeServ.confirmPayment(
            confirmPaymentDto.paymentId,
            confirmPaymentDto.paymentMethodId,
        );

        const pay = await this.findById(payment.id);

        if (!pay) {
            throw new RpcException({
                status: HttpStatus.NOT_FOUND,
                message: 'Payment not found'
            })
        } else {
            await this.payment.update({
                where: { id: payment.id },
                data: {
                    status: this.getStatusPayment(payment.status)
                }
            });
        }

        return payment;
    }

    async findCustomerPayments(customerId: string) {
        if (!customerId) throw new RpcException({
            status: HttpStatus.NOT_FOUND,
            message: `This customer with id #${customerId} not found`
        });

        return this.stripeServ.findCustomerPayments(customerId);
    }

    async findCustomerPayment(customerId: string, paymentId: string) {
        if (!customerId) throw new RpcException({
            status: HttpStatus.NOT_FOUND,
            message: `This customer with id #${customerId} not found`
        });

        const payment = await this.stripeServ.findCustomerPayment(
            customerId,
            paymentId,
        );

        if (!payment) throw new RpcException({
            status: HttpStatus.NOT_FOUND,
            message: `This payment with id #${paymentId} not found`
        });

        return payment;
    }

    async assertUserOwnsPayment(userId: number, paymentId: string) {
        const payment = await this.findOne(paymentId, userId);

        if (!payment) throw new RpcException({
            status: HttpStatus.FORBIDDEN,
            message: `Payment is forbidden`
        })
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

    getStatusPayment(status: string): PaymentStatus {
        if (status === 'succeeded') {
            return PaymentStatus.SUCCEEDED;
        } else if (status === 'pending') {
            return PaymentStatus.PENDING;
        } else if (status === 'failed') {
            return PaymentStatus.FAILED;
        } else {
            return PaymentStatus.CANCELED;
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
            paymentIntentId: data.id, 
            amount: data.amount_total, 
            currency: data.currency,
            cuid: cuid, 
            userId: userId, 
            status: this.getStatusPayment(data.status),
            totalItems: quantity, 
            paidAt: new Date(), 
            customerId: customerId
        });
    }
}
