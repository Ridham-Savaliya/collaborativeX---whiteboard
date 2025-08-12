import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_error`);
    }

    try {
        const { provider, isRegister, email, collaboratorEmail } = JSON.parse(decodeURIComponent(state));
        let userInfo;

        switch (provider) {
            case 'google':
                userInfo = await axios.post('https://oauth2.googleapis.com/token', {
                    code,
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_SECRET,
                    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback/google`,
                    grant_type: 'authorization_code'
                }).then(res => axios.get('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${res.data.access_token}` } })).then(res => ({ email: res.data.email, name: res.data.name, picture: res.data.picture }));
                break;
            case 'microsoft':
                userInfo = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
                    code,
                    client_id: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
                    client_secret: process.env.AZURE_AD_CLIENT_SECRET,
                    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback/microsoft`,
                    grant_type: 'authorization_code'
                }).then(res => axios.get('https://graph.microsoft.com/v1.0/me', { headers: { Authorization: `Bearer ${res.data.access_token}` } })).then(res => ({ email: res.data.mail || res.data.userPrincipalName, name: res.data.displayName, picture: null }));
                break;
            case 'linkedin':
                userInfo = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
                    code,
                    client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID,
                    client_secret: process.env.LINKEDIN_SECRET,
                    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback/linkedin`,
                    grant_type: 'authorization_code'
                }).then(res => Promise.all([
                    axios.get('https://api.linkedin.com/v2/people/~', { headers: { Authorization: `Bearer ${res.data.access_token}` } }),
                    axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', { headers: { Authorization: `Bearer ${res.data.access_token}` } })
                ])).then(([profile, email]) => ({ email: email.data.elements[0]['handle~'].emailAddress, name: `${profile.data.firstName.localized.en_US} ${profile.data.lastName.localized.en_US}`, picture: null }));
                break;
            case 'facebook':
                userInfo = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
                    params: { code, client_id: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID, client_secret: process.env.FACEBOOK_SECRET, redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/callback/facebook` }
                }).then(res => axios.get('https://graph.facebook.com/me', { params: { fields: 'id,name,email,picture', access_token: res.data.access_token } })).then(res => ({ email: res.data.email, name: res.data.name, picture: res.data.picture?.data?.url }));
                break;
            default:
                throw new Error('Unsupported provider');
        }

        const forgotPasswordEmail = request.cookies.get('forgotPasswordEmail')?.value;
        if (forgotPasswordEmail && userInfo.email === forgotPasswordEmail) {
            const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?oauthVerified=true`);
            response.cookies.delete('forgotPasswordEmail');
            return response;
        }

        const authResponse = await axios.post(`${process.env.NEXTAUTH_URL}/api/oauth-login`, { email: userInfo.email, name: userInfo.name, provider, providerId: userInfo.email });
        const { token, user } = authResponse.data;

        const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/${isRegister ? 'register' : 'login'}?oauth_success=true&name=${encodeURIComponent(user.name)}`);
        response.cookies.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7 });
        const html = `<script>localStorage.setItem('token', '${token}'); localStorage.setItem('userId', '${user.id}'); window.location.href = '${isRegister ? '/register' : '/login'}?oauth_success=true&name=${encodeURIComponent(user.name)}';</script>`;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_callback_failed`);
    }
}