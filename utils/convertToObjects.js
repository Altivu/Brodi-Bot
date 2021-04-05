// Copied from https://stackoverflow.com/a/63767962, with modifications
exports.convertToObjects = (headers, rows) => {
  return rows.reduce(
    (ctx, row) => {
      ctx.objects.push(
        ctx.headers.reduce((item, header, index) => {
          if (header !== "") {
            item[header] = row[index];
          }

          return item;
        }, {})
      );
      return ctx;
    },
    { objects: [], headers }
  ).objects;
}

// Copied from https://discordjs.guide/additional-info/rest-api.html#urban-dictionary
exports.trim = (str, max) => ((str.length > max) ? `${str.slice(0, max - 3)}...` : str);
