import * as yup from "yup";

export default yup.object({
  email: yup

    .string()

    .email("Email không hợp lệ")

    .required(),

  password: yup

    .string()

    .min(6, "Ít nhất 6 ký tự")

    .required(),
});
