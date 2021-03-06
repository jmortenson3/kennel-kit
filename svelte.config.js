import preprocess from "svelte-preprocess";
import path from "path";
import netlify from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

  kit: {
    adapter: netlify(),
    // hydrate the <div id="svelte"> element in src/app.html
    target: "#svelte",
    vite: {
      resolve: {
        alias: {
          $components: path.resolve("./src/lib/components"),
        },
      },
      ssr: {
        noExternal: [ 'dayjs' ],
      }
    },
  },
};

export default config;
