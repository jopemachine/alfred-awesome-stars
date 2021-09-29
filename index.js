import alfy from 'alfy';

const id = process.env['githubUserId'];

if (!id) {
  alfy.error('githubUserId is not set!. please read README.md first.');
  process.exit(1);
}

const url = `https://api.github.com/repos/${id}/awesome-stars/readme`;

const repoInfoRegexp = /\- \[(?<maintainer>.*)\/(?<repoName>[A-Za-z0-9_.-]*)\](?<urlWithBracket>.*) \- (?<description>.*)/;

const parseRepositoryInfo = (str) => {
  let matched = str.match(repoInfoRegexp);

  if (matched) {
    return matched.groups;
  }

  return undefined;
};

const ban = [
  'Contents',
  'License'
];

const removeBraket = (str) => {
  return str.substr(1, str.length - 2);
}

const transformData = (lang, repoInfo) => {
  const title = `[${lang}] ${repoInfo.maintainer}/${repoInfo.repoName}`;
  return {
    title,
    subtitle: repoInfo.description,
    arg: removeBraket(repoInfo.urlWithBracket),
    text: {
      copy: title,
      largetype: title,
    },
  };
};

(async () => {
  const starredListRawString =
    await alfy.fetch(url, { maxAge: 60 * 60 * 24 })
      .then((response) => response.content)
      .then((content) => Buffer.from(content, 'base64').toString('utf-8'));

  const splits = starredListRawString.split(/(\#\#.*)/);

  let lang = '(undefined)';
  const data = [];

  splits.forEach((line) => {
    if (line.startsWith('##') && !ban.includes(line.split('## ')[1])) {
      lang = line.split('##')[1].trim();
    } else {
      line.split('\n').forEach((repoInfoLine) => {
        if (repoInfoLine.trim() !== '') {
          const repoInfo = parseRepositoryInfo(repoInfoLine);

          if (repoInfo) {
            data.push(transformData(lang, repoInfo));
          }
        }
      });
    }
  });

  const result = data.filter((item) => {
    let ret = false;
    alfy.input.normalize().split(' ').forEach((word) => {
      if (!ret) {
        ret = item.title.toLowerCase().includes(word.toLowerCase()) || item.subtitle.toLowerCase().includes(word.toLowerCase());
      }
    });

    return ret;
  });

  const summary = {
    title: `${result.length} repositories were found.`,
    subtitle: 'Press enter to open starred repositories\'s url',
    arg: `https://github.com/${id}?tab=stars`
  };

  alfy.output([
    summary,
    ...result
  ]);
})();

