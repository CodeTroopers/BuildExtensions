# Extension : RITS Build and Release Tools

Tools for building and releasing Refresh IT Solutions products.

## Copy task

### To build the task

cd copyTask
npm run build

### To test the task

npm test

## To package the extension

npm install -g tfx-cli
tfx extension create --manifest-globs vss-extension.json
