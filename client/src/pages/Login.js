import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert,
  Grid
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const { login, requestOtp, verifyOtp, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const { email, password } = formData;
  const [loginMode, setLoginMode] = useState('password'); // 'password' | 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devCodeInfo, setDevCodeInfo] = useState('');

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setFormError('');
    if (loginMode === 'password') {
      if (!email || !password) {
        setFormError('Please enter all fields');
        return;
      }
      const success = await login({ email, password });
      if (success) navigate('/');
    } else {
      if (!email) {
        setFormError('Please enter your email to request OTP');
        return;
      }
      const res = await requestOtp(email);
      if (res.success) {
        setOtpSent(true);
        if (res.devCode) setDevCodeInfo(`Dev code: ${res.devCode}`);
      }
    }
  };

  const onVerifyOtp = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email || !otpCode) {
      setFormError('Please enter the OTP code');
      return;
    }
    const success = await verifyOtp({ email, code: otpCode });
    if (success) navigate('/');
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            SENTRY-DOC
          </Typography>
          <Typography component="h2" variant="h5" align="center">
            Sign In
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              variant={loginMode === 'password' ? 'contained' : 'outlined'}
              onClick={() => setLoginMode('password')}
              sx={{ mr: 1 }}
            >
              Password Login
            </Button>
            <Button 
              variant={loginMode === 'otp' ? 'contained' : 'outlined'}
              onClick={() => { setLoginMode('otp'); setOtpSent(false); setOtpCode(''); setDevCodeInfo(''); }}
            >
              OTP via Gmail
            </Button>
          </Box>
          
          {(error || formError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError || error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={onSubmit} sx={{ mt: 3 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={onChange}
            />
            {loginMode === 'password' ? (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={onChange}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                >
                  Sign In
                </Button>
              </>
            ) : (
              <>
                {!otpSent ? (
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                  >
                    Send OTP
                  </Button>
                ) : (
                  <>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="otp"
                      label="Enter OTP"
                      name="otp"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                    />
                    {devCodeInfo && (
                      <Typography variant="caption" color="text.secondary">
                        {devCodeInfo}
                      </Typography>
                    )}
                    <Button
                      onClick={onVerifyOtp}
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                    >
                      Verify OTP
                    </Button>
                  </>
                )}
              </>
            )}
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Don't have an account? Sign Up
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;