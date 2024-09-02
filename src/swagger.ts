import swaggerJSDoc, { Options } from 'swagger-jsdoc';

const option: Options  =  {

    swaggerDefinition :  {
    
    "swagger": "2.0",

    "info": {
        "title": "XBooks API",
        "version": "1.0.0",
        "description": "API documentation for XBooks project"
    },

    "servers": [
        {
        "url": "https://backend-production-7b98.up.railway.app"
        }
    ],
    },
    apis :  [ './src/routes/*.ts' ],
};

const swaggerSpec = swaggerJSDoc(option);

export default swaggerSpec;