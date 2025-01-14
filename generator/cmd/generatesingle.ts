import * as constants from '../constants';
import { cloneAndGenerateBasePaths, resolveAbsolutePath, validateAndReturnReadmePath, getPackageString } from '../specs';
import { generateSchemas, saveAutogeneratedSchemaRefs } from '../generate';
import process from 'process';
import { findAutogenEntries } from '../autogenlist';
import chalk from 'chalk';
import { executeSynchronous } from '../utils';

executeSynchronous(async () => {
    const basePath = process.argv[2];
    let localPath = process.argv[3];
    if (!localPath) {
        localPath = constants.specsRepoPath;
        await cloneAndGenerateBasePaths(localPath, constants.specsRepoUri, constants.specsRepoCommitHash);
    } else {
        localPath = await resolveAbsolutePath(localPath);
    }

    let readme = '';
    try {
        readme = await validateAndReturnReadmePath(localPath, basePath);
    } catch {
        throw new Error(`Unable to find a readme under '${basePath}'. Please try running 'npm run list-basepaths' to find the list of valid paths.`);
    }

    const schemaConfigs = [];
    const autogenEntries = findAutogenEntries(basePath);

    if (autogenEntries.length === 0) {
        const localSchemaConfigs = await generateSchemas(readme);
        schemaConfigs.push(...localSchemaConfigs);
    } else {
        for (const autogenlistConfig of autogenEntries) {
            console.log(`Using autogenlist config:`)
            console.log(chalk.green(JSON.stringify(autogenlistConfig, null, 2)));

            const localSchemaConfigs = await generateSchemas(readme, autogenlistConfig);
            schemaConfigs.push(...localSchemaConfigs);
        }
    }

    await saveAutogeneratedSchemaRefs(schemaConfigs);
});