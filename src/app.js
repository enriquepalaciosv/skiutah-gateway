const fetch = require("node-fetch");
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.REGION || "us-west-2" });
const SSM = new AWS.SSM();
let response;

exports.lambdaHandler = async (event, context) => {
  try {
    const { SKI_UTAH_ENDPOINT, SKI_UTAH_USER, SKI_UTAH_PASSWORD } = process.env;
    const usrPwd = `${SKI_UTAH_USER}:${SKI_UTAH_PASSWORD}`;
    const buff = Buffer.from(usrPwd, "utf-8");
    const base64 = buff.toString("base64");
    const skiUtahResponse = await fetch(SKI_UTAH_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Basic ${base64}`,
      },
    });
    const skiUtahData = await skiUtahResponse.json();
    const highest = Math.max(...skiUtahData.map((d) => d.new_snow_48));

    const param = await SSM.putParameter({
      Name: process.env.PARAMETER_NAME,
      Value: `${highest}`,
      Overwrite: true,
      Type: "String",
    }).promise();

    response = {
      statusCode: 200,
      body: `Value set to ${highest}`,
    };
  } catch (err) {
    console.log(err);
    return err;
  }

  return response;
};