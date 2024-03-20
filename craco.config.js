// craco.config.js
module.exports = {
    style: {
      postcss: {
        mode: "extends",
        loaderOptions: (postcssLoaderOptions, { env, paths }) => { return postcssLoaderOptions; },
      },
    },
  };
  