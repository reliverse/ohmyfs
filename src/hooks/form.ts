import { createFormHook } from "@tanstack/react-form";

import {
  Field,
  Select,
  Slider,
  SubscribeButton,
  TextArea,
  TextField,
} from "../components/form-components";
import { fieldContext, formContext } from "./form-context";

export const { useAppForm } = createFormHook({
  fieldComponents: {
    Field,
    TextField,
    Select,
    TextArea,
    Slider,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
});
