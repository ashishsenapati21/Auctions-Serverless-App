import {v4 as uuid} from 'uuid';
import AWS from 'aws-sdk';
import commonMidware from '../lib/midware'
import createError from 'http-errors';
import validator from '@middy/validator';
import createAuctionSchema from '../lib/schemas/createAuctionSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
  const { title } = event.body;
  const now = new Date();
  const end = new Date();
  end.setHours(now.getHours() + 1);

  const auction = {
    id: uuid(),
    title,
    highestBid: {
      amount: 0
    },
    status: 'OPEN',
    createdAt: now.toISOString(),
    endingAt: end.toISOString(),
  };

  try {
    await dynamodb.put({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Item: auction,
    }).promise();
  } catch(error) {
    throw new createError.InternalServerError(error);
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}

export const handler = commonMidware(createAuction).use(validator({ inputSchema: createAuctionSchema }));


