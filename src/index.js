const core = require("@actions/core");
require("dotenv").config();
const mv = require("mv");
const fs = require("fs");
const path = require("path");
const fsPromises = fs.promises;
const findRootPackageJson = (startDirectory) => {
  const packagePath = path.join(startDirectory, "package.json");
  if (fs.existsSync(packagePath)) return startDirectory;
  const pathAbove = path.join(startDirectory, "..");
  return findRootPackageJson(pathAbove);
};
const moveFile = async ({
  file_name = "",
  directory_start = "",
  directory_des = "",
  extension = "env",
}) => {
  let curr_path = path.join(directory_start, `${file_name}.${extension}`);
  let destination_folder = directory_des;
  let destination = path.join(destination_folder, `${file_name}.${extension}`)
  try {
    //create folder if it doesnt exist
    if (!fs.existsSync(destination_folder)) {
      await fsPromises.mkdir(destination_folder);
    }

    //move file
    mv(curr_path, destination, function (err) {
      if (err) {
        throw err;
      } else {
        console.log(`successfully moved ${file_name}`);
      }
    });
  } catch (e) {
    console.error(e);
  }
};

const createEnv = async () => {
  const secretsParse = JSON.parse(core.getInput("REACT_APP_SECRETS"));
  const reactAppSecrets = Object.entries(secretsParse).filter(([key, value]) =>
    /REACT_APP.*/.test(key)
  );
  const envValues = {};
  for (let [key, value] of reactAppSecrets) envValues[key] = value;
  delete envValues.AWS_S3_DEPLOY_USER_ACCESS_KEY_ID;
  delete envValues.AWS_S3_DEPLOY_USER_SECERT_KEY;
  const envContent = Object.keys(envValues).map(
    (key) => `${key}=${envValues[key]}\r\n`
  );
  await fsPromises.writeFile(path.join(__dirname, ".env"), envContent);
  return "Env Created";
};
createEnv()
  .then(async (payload) => {
    console.log(payload);
    const curr_dir = __dirname;
    const directory_des = findRootPackageJson(curr_dir);
    //move to root directory
    await moveFile({
      file_name: "",
      extension: "env",
      directory_start: curr_dir,
      directory_des: directory_des,
    });
    console.log("File moved to root");
  })
  .catch((e) => {
    core.setFailed(e.message);
    console.error(e);
  });
