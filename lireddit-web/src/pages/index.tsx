import { NavBar } from "../components/NavBar";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import React from "react";
import { Box } from "@chakra-ui/react";

const Index = () => {
  const [{ data, fetching }] = usePostsQuery();

  let body;
  if (fetching) {
    body = <Box mt={2}>Fetching posts...</Box>;
  } else if (!data?.posts) {
    body = <div>no posts found</div>;
  } else {
    body = data.posts.map((post) => (
      <Box key={post.id} mt={2}>
        {post.title}
      </Box>
    ));
  }

  return (
    <>
      <NavBar />
      <Box my={6} fontWeight="bold">
        Post here:
      </Box>
      {body}
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
