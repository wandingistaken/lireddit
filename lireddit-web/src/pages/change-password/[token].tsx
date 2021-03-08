import { Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import React from "react";
import { InputField } from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";

const ChangePassword: NextPage<{ token: string }> = ({ token }) => (
  <Wrapper variant="small">
    {/* <div>token is {token}</div> */}
    <Formik
      initialValues={{ newPassword: "" }}
      onSubmit={(values) => console.log(values)}
    >
      {() => (
        <Form>
          <InputField
            name="newPassword"
            label="New Password"
            type="password"
          />
          <Button
            mt={4}
            type="submit"
            // isLoading={}
            colorScheme="teal"
          >
            Change Password
          </Button>
        </Form>
      )}
    </Formik>
  </Wrapper>
);

ChangePassword.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};

export default ChangePassword;
