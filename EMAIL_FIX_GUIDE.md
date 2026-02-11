# Email Sending Fix - Setup Guide

## Issues Fixed

1. **JWT Verification Error** - The Edge Function required JWT authentication which was causing 400 errors
2. **Missing Error Context** - Added detailed logging to help debug future issues
3. **CORS Issues** - Improved CORS header handling

## Changes Made

### 1. Updated `supabase/config.toml`
- Changed `verify_jwt = true` to `verify_jwt = false`
- This allows unauthenticated requests from your frontend

### 2. Enhanced `supabase/functions/send-email/index.ts`
- Added better JSON parsing error handling
- Added detailed validation error messages
- Added comprehensive logging for debugging
- Added `replyto` field to email payload
- Improved newline handling in HTML email body
- Better error responses with status codes

## Required Vercel Environment Variables

You MUST set these in your Vercel project settings:

```
SUPABASE_URL=https://zmoastzbdtngowmdvazn.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
ZEPTO_TOKEN=Zoho-enczapikey_your_token_here
```

### Important: ZEPTO_TOKEN Format
- Must start with `Zoho-enczapikey` 
- If your token doesn't have this prefix, the function will add it automatically
- Get this from your Zeptomail API settings

## Steps to Deploy

1. **Push code changes to GitHub**
   ```bash
   git add .
   git commit -m "Fix email function JWT and error handling"
   git push origin main
   ```

2. **Set environment variables in Vercel**
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add `ZEPTO_TOKEN` with your Zeptomail API key
   - Redeploy your project

3. **Test the form**
   - Fill out the contact form
   - Check browser console for detailed error messages
   - Check Vercel Function logs for backend errors

## Debugging Tips

If email still doesn't send:

1. **Check Vercel logs:**
   - Go to Vercel Dashboard > Your Project > Functions
   - Look for the `send-email` function logs
   - Check for `Zepto Response Status` and `Zepto Response Body`

2. **Verify Zeptomail configuration:**
   - Verify API token is correct
   - Check that sender email `noreply@privetserver.com` is verified
   - Check that recipient domain is verified
   - Ensure account is active and not rate-limited

3. **Test locally (if needed):**
   ```bash
   supabase functions invoke send-email --local \
     --body '{"sender_email":"test@example.com","message":"Test message"}'
   ```

## Common Zeptomail Errors

| Error | Solution |
|-------|----------|
| `Invalid API key` | Check ZEPTO_TOKEN format starts with `Zoho-enczapikey` |
| `Sender not verified` | Add `noreply@privetserver.com` as sender in Zeptomail |
| `Invalid recipient` | Ensure `support@privetserver.com` is accessible |
| `Rate limit exceeded` | Check your Zeptomail account limits |

## Next Steps

If still having issues:
1. Check Zeptomail account status
2. Verify sender and recipient email addresses
3. Check API token is not expired
4. Review Zeptomail documentation for your region (COM vs EU vs IN)
