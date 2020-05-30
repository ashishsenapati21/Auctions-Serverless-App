import AWS from 'aws-sdk';
import commonMidware from '../lib/midware'
import createError from 'http-errors';
import validator from '@middy/validator';
import getAuctionSchema from '../lib/schemas/getAuctionSchema';


const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuction(event, context) {
  const { status } = event.queryStringParameters;
  let auction;

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status',
    ExpressionAttributeValues: {
      ':status': status
    },
    ExpressionAttributeNames: {
      '#status':'status'
    }
  };

  try {
      const result = await dynamodb.query(params).promise();

      auction = result.Items; 

  } catch (error) {
    throw new createError.InternalServerError(error);
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
}

export const handler = commonMidware(getAuction).use(validator({ inputSchema : getAuctionSchema, useDefaults: true }));


