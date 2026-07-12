import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: null,

    token: null,

    role: null,

    isLogin: false,
  },

  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;

      state.token = action.payload.token;

      state.role = action.payload.role;

      state.isLogin = true;
    },

    logout: (state) => {
      state.user = null;

      state.token = null;

      state.role = null;

      state.isLogin = false;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
