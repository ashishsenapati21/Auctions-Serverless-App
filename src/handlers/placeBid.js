import AWS from 'aws-sdk';
import commonMidware from '../lib/midware'
import createError from 'http-errors';
import { getAuctionById } from './getAuctionById'

import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
    let update;
    const { id } = event.pathParameters;
    const { amount } = event.body;

    const auction = await getAuctionById(id);

    if(auction.status !== 'OPEN') {
        throw new createError.Forbidden('Cannot bid on closed auctions');
    }
    
    if (amount <= auction.highestBid.amount) {
        throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`)
    }

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount',
        ExpressionAttributeValues: {
            ':amount': amount,
        },
        ReturnValues: 'ALL_NEW'
    }

    try {
        const result = await dynamodb.update(params).promise();
        update = result.Attributes;
    } catch (error) {
        throw new createError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(update),
    };
}

export const handler = commonMidware(placeBid).use(validator({ inputSchema : placeBidSchema}));