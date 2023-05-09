import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { Tooltip } from "@material-ui/core";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../lib/theme.context";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useAuth } from "../lib/auth.context";
import Divider from "@mui/material/Divider";

export default function MenuAppBar() {
  const [profileAnchorEl, setProfileAnchorEl] = React.useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const { theme, toggleTheme } = useTheme();

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleMenuClick = (e) => {
    setMenuAnchorEl(e.currentTarget);
    console.log(user);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleMenuClick}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="basic-menu"
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
          >
            <MenuItem onClick={() => navigate("/dashboard")}>
              Dashboard
            </MenuItem>
            {user.isAdmin && (
              <MenuItem onClick={() => navigate("/admin")}>Admin</MenuItem>
            )}
          </Menu>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CSF Volunteering
          </Typography>
          <div>
            <Tooltip title="Account">
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileClick}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
            </Tooltip>
            <Menu
              id="menu-appbar"
              anchorEl={profileAnchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(profileAnchorEl)}
              onClose={handleProfileClose}
            >
              <Box sx={{ px: 2, pb: 2, pt: 1 }}>
                <Typography>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <Divider />
              <Box component="li" sx={{ px: 2, pt: 1 }}>
                {theme} mode
                <IconButton
                  sx={{ ml: 1 }}
                  onClick={toggleTheme}
                  color="inherit"
                >
                  {theme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Box>
              <MenuItem
                onClick={() => {
                  logout();
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
