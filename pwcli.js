/* -*- mode: javascript -*- */

const fs = require ('fs');


if (! fs.existsSync ("package.json")) {
  process.stdout.write ("need:\n" + "npm init --yes\n");
  process.exit (1);
}

let want = [
  "sprintf-js",
  "minimist",
  "child_process"
];
let need = [];
want.forEach ((mod) => {62
  if (! fs.existsSync ("node_modules/" + mod))
    need.push (mod);
});
if (need.length > 0) {
  process.stdout.write ("npm install --save " + need.join (" ") + "\n");
  process.exit (1);
}

var argv = require('minimist')(process.argv.slice(2));


var sprintf_js = require ('sprintf-js');
var sprintf = sprintf_js.sprintf;
var vsprintf = sprintf_js.vsprintf;
function printf (fmt, ...args) { process.stdout.write (vsprintf (fmt, args)); }

global.printf = printf;
global.sprintf = sprintf;

var child_process = require ('child_process');

function slurp_file (filename) {
    try {
      return (fs.readFileSync (filename, "utf8"));
    } catch (e) {
	if (e.code != 'ENOENT') {
	    console.log (e);
	    process.exit (1);
	}
    }

    return ("");
}
exports.slurp_file = slurp_file;

function read_json_file (filename) {
    var str = slurp_file (filename);
    if (str == "") {
	return ({});
    }
    
    try {
	return (JSON.parse (str));
    } catch (e) {
	console.log ("error parsing " + filename);
	console.log (e);
	process.exit (1);
    }
}

let pkgs = [
  "apache2",
  "emacs-nox",
  "nodejs",
  "libapache2-mod-php",
  "awscli"
];

exports.ls_setup = function () {
  if (argv._.length == 0) {
    printf ("usage: ls-setup SERVERNAME\n");
    process.exit (1);
  }
  let servername = argv._[0];

  let HOME = process.env['HOME'];
  let user = process.env['USER'];

  let fullname = child_process.execSync (
    sprintf ("getent passwd %s | cut -d: -f5", user), 
    { encoding: "utf8" })
      .trim()
      .replace (/,.*/, '');
  
  child_process.execSync ("sudo sh -c 'cd /etc/apache2; tar -cf - wildcard.*'" +
			  " > TMP.wild.tar");

  let f_gitconfig = sprintf ("%s/.gitconfig", HOME);
  let gitconfig = slurp_file (f_gitconfig);
  fs.writeFileSync ("TMP.gitconfig", gitconfig)

  let f_sshpub = sprintf ("%s/.ssh/id_rsa.pub", HOME);

  let scfg = "";
  scfg += sprintf ("MAIN_USER=%s\n", user);
  scfg += sprintf ("MAIN_FULLNAME='%s'\n", fullname);
  scfg += sprintf ("PKGS='%s'\n", pkgs.join (" "));
  scfg += sprintf ("SERVERNAME='%s'\n", servername);

  fs.writeFileSync ("TMP.sh", scfg);

  let files = [];
  files.push ("pwcli.js");
  files.push ("ls-setup2");
  files.push ("TMP.sh");
  files.push (f_sshpub);
  files.push ("TMP.gitconfig");
  files.push ("TMP.wild.tar");

  let cmd = sprintf ("scp %s bitnami@%s:", files.join (" "), servername);
  
  let ret = child_process.execSync (cmd, { encoding: "utf8" });
  if (ret.trim () != "") {
    printf ("error sending config files:\n");
    printf ("%s\n", ret);
    process.exit (1);
  }

  fs.unlinkSync ("TMP.wild.tar");

  printf ("run:\n");
  printf ("ssh bitnami@%s ./ls-setup2\n", servername);

}
