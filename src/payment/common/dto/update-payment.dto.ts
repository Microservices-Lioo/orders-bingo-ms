import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { IsString, IsUUID } from 'class-validator';


export class UpdatePayment extends PartialType(CreatePaymentDto) {
    @IsUUID()
    @IsString()
    id: string;
}