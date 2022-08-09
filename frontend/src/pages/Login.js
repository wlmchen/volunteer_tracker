import { Grid, Typography, useTheme } from "@material-ui/core";
import AccountCircle from "@mui/icons-material/AccountCircle";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import * as React from "react";
import { useAuth } from "../lib/auth.context";
import Alert from "@mui/material/Alert";

export default function Login() {
  const { loading, error, login } = useAuth();
  const { toggleTheme } = useTheme();

  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (error) {
      setOpen(true);
    }
  }, [loading]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  const [values, setValues] = React.useState({
    username: "",
    password: "",
  });

  const handleChange = (prop) => (event) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(values.username, values.password);
  };

  return (
    <Grid>
      <Grid
        item
        container
        xs={12}
        sm={6}
        md={4}
        align="center"
        style={{ margin: "auto" }}
        spacing={2}
        direction="column"
      >
        <Typography variant="h5">CSF Volunteering</Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", alignItems: "flex-end", width: 1 }}>
            <AccountCircle sx={{ color: "action.active", mr: 1, my: 0.5 }} />
            <TextField
              id="username"
              label="Username"
              value={values.username}
              onChange={handleChange("username")}
              variant="standard"
              fullWidth
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "flex-end" }}>
            <VpnKeyIcon sx={{ color: "action.active", mr: 1, my: 0.5 }} />
            <TextField
              id="password"
              label="Password"
              type="password"
              value={values.password}
              onChange={handleChange("password")}
              variant="standard"
              fullWidth
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ mt: 5, px: "32px", py: "10px" }}
          >
            Log In
          </Button>
        </form>
      </Grid>
      {error && (
        <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
          <Alert
            // onClose={handleClose}
            severity="error"
            elevation={6}
            variant="filled"
          >
            {error}
          </Alert>
        </Snackbar>
      )}
    </Grid>
  );
}
