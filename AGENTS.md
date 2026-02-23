Hey, I have a project in ~/Documents/organizations/icelook2/api/ which serves HTTP REST API using Cloudflare. Before implmenting any feature please check if endpoint is created and what data it expected to see and what data it returns and create respective types in the project.

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated - the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:base-ui-agent-rules -->
# Base UI: ALWAYS read docs before creating/editing UI components

Before any work that related to creating or updating UI components, find and read the relevant doc in `https://base-ui.com/llms.txt`. Your training data is outdated - the docs are the source of truth.
<!-- END:base-ui-agent-rules -->


<!-- BEGIN:zod-agent-rules -->
# Zod: ALWAYS read docs before creating or managing schemas and form validations

Before any work that related to validating data using zod in react-hook-form, server actions, or client side validation, find and read the relevant doc in `https://zod.dev` (v4+). Your training data is outdated - the docs are the source of truth.
<!-- END:zod-agent-rules -->


<!-- BEGIN:react-hook-form-agent-rules -->
# react-hook-form: ALWAYS read docs before creating or managing forms

Before any work that related to creating or managing react forms on client or server, find and read the relevant doc in `https://react-hook-form.com`. Your training data is outdated - the docs are the source of truth.
<!-- END:react-hook-form-agent-rules -->
