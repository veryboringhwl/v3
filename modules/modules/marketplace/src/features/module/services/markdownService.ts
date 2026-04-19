import { Octokit } from "https://esm.sh/octokit";

const octokit = new Octokit({});

export const renderMarkdown = async (text: string) => {
  const response = await octokit.rest.markdown.render({ text });
  return response.data;
};
