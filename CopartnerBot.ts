import { Telegraf, Context } from 'telegraf';
import axios from 'axios';

// Replace with your bot token
const TOKEN = '7369586312:AAHlFDtM8wuOEg6_kehLpPGI7Vkhm6hodEE';
const bot = new Telegraf(TOKEN);

// Store the mobile number for sessions
const sessions: Record<number, { mobileNumber: string }> = {};

// Helper function to check if the message contains text
function isTextMessage(ctx: Context): ctx is Context & { message: { text: string } } {
  return ctx.message !== undefined && 'text' in ctx.message && typeof ctx.message.text === 'string';
}

// Start command handler
bot.start((ctx: Context) => {
  ctx.reply('Hi! Welcome to Copartner. \n Ab aapko SEBI-Registered Telegram Channels se calls milenge Bilkul FREE ! \n Enter your Mobile N. to Get Access Of Free Calls \n Example: 98657*** \n Message by API');
});

// Message handler for text messages
bot.on('text', async (ctx: Context) => {
  const chatId = ctx.chat?.id;

  if (!isTextMessage(ctx) || !chatId) {
    return;
  }

  const text = ctx.message.text;

  // Validate mobile number
  if (/^\d{10}$/.test(text)) {
    const mobileNumber = text;
    sessions[chatId] = { mobileNumber };

    // Generate OTP using the external API
    try {
      const response = await axios.post('https://copartners.in:5181/api/SignIn/GenerateOTP', {
        countryCode: 'IN',
        mobileNumber,
        otp: "", // Assuming OTP is handled by the API
      });

      console.log(response.data); // Log the response to see what comes back

      if (response.status === 200 && response.data.isSuccess) {
        ctx.reply(`OTP has been sent to ${mobileNumber}. Please check your SMS and enter the OTP here.`);
      } else {
        ctx.reply('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error(error);
      ctx.reply('Failed to send OTP due to a network error. Please try again.');
    }
  } else if (sessions[chatId] && sessions[chatId].mobileNumber) {
    // Handle OTP input
    const mobileNumber = sessions[chatId].mobileNumber;
    const otp = text; // The entered OTP by the user

    // Verify OTP using the external API
    try {
      const response = await axios.post('https://copartners.in:5181/api/SignIn/ValidateOTP', {
        countryCode: 'IN',
        mobileNumber,
        otp,
      });

      console.log(response.data); // Log the response to see what comes back

      if (response.status === 200 && response.data.isSuccess) {
        ctx.reply('OTP verified successfully! Here are some channels you might like:');
        ctx.reply(
          '1. [Channel 1](https://t.me/+xlUQhnpj_G4wYmRl)\n' +
          '2. [Channel 2](https://t.me/+nfirWJkEunwwMjll)\n' +
          '3. [Channel 3](https://t.me/+S317EhDaovY2YTU1)\n' +
          '4. [Channel 4](https://t.me/+OUNZUEJRifE4MDY1)',
          { parse_mode: 'Markdown' }
        );
        delete sessions[chatId]; // Clear session after successful verification
      } else {
        ctx.reply('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error(error);
      ctx.reply('Failed to verify OTP due to a network error. Please try again.');
    }
  } else {
    ctx.reply('Please enter a valid mobile number.');
  }
});

// Start polling
bot.launch();
