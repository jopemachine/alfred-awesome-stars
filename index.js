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
  return str.substr(1, str.length - 1);
}


const transformData = (lang, repoInfo) => {
  return {
    title: `[${lang}][${repoInfo.maintainer}/${repoInfo.repoName}]`,
    subtitle: repoInfo.description,
    arg: removeBraket(repoInfo.urlWithBracket)
  };
};

(async () => {
  const starredListRawString = await alfy.fetch(url, { maxAge: 60 * 60 * 24 });

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

  alfy.output(data.filter((item) => {
    let ret = false;
    alfy.input.split(' ').forEach((word) => {
      if (!ret) {
        ret = item.title.toLowerCase().includes(word.toLowerCase());
      }
    });

    return ret;
  }));
})();

