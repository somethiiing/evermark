import path from 'path'
import test from 'ava'
import fileUtils from '../src/fileUtils'
import config from '../src/config'
import utils from './helpers/utils'

const fixturesDir = `${__dirname}${path.sep}fixtures`

function getTestDir(root = false) {
  const rootDir = `${__dirname}${path.sep}config-test`
  return root ? rootDir : `${rootDir}${path.sep}${utils.randomString()}`
}

test.before(async () => {
  await fileUtils.remove(getTestDir(true))
})

test.after(async () => {
  await fileUtils.remove(getTestDir(true))
})

test('should getConfigPath', async t => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)

  const configPath = await config.getConfigPath(testDir)
  t.is(configPath, `${testDir}${path.sep}evermark.json`)

  t.throws(config.getConfigPath(`${path.sep}test`),
    'Please run `evermark init [destination]` to init a new Evermark folder')
})

test('should getDbPath', async t => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)

  const dbPath = await config.getDbPath(testDir)
  t.is(dbPath, `${testDir}${path.sep}evermark.db`)
})

test('should readConfig', async t => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)

  const conf = await config.readConfig(testDir)
  t.is(conf.token, 'foo')
  t.false(conf.china)
  t.true(conf.sandbox)
})

test('should readConfig error when config file invalid', async t => {
  t.throws(config.readConfig(),
    'Please run `evermark init [destination]` to init a new Evermark folder')

  const testDir = getTestDir()
  const configPath = `${testDir}/evermark.json`
  await fileUtils.fs.copyAsync(fixturesDir, testDir)

  await fileUtils.writeFile(configPath, 'token')
  await t.throws(config.readConfig(testDir),
    `Please write to ${configPath}:\n\n` +
    `{\n  "token": "xxx",\n  "china": xxx\n}`)

  await fileUtils.writeFile(configPath, '{ "china": true }')
  t.throws(config.readConfig(testDir),
    `Please write developer token to ${configPath}\n\n` +
    'To get a developer token, please visit:\n  ' +
    'https://www.evernote.com/api/DeveloperToken.action or ' +
    'https://app.yinxiang.com/api/DeveloperToken.action')
})

test('should getConfig', async t => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)

  const token = await config.getConfig('token', testDir)
  const china = await config.getConfig('china', testDir)
  const sandbox = await config.getConfig('sandbox', testDir)
  const hello = await config.getConfig('hello', testDir)

  t.is(token, 'foo')
  t.false(china)
  t.true(sandbox)
  t.is(hello, undefined)
})

test('should setConfig', async t => {
  const testDir = getTestDir()
  await fileUtils.fs.copyAsync(fixturesDir, testDir)

  let result = await config.setConfig('token', 'bar', testDir)
  t.is(result, `{
  "token": "bar",
  "china": false,
  "sandbox": true
}`)

  result = await config.setConfig('china', 'true', testDir)
  t.is(result, `{
  "token": "bar",
  "china": true,
  "sandbox": true
}`)

  result = await config.setConfig('hello', 'false', testDir)
  t.is(result, `{
  "token": "bar",
  "china": true,
  "sandbox": true,
  "hello": false
}`)

  const conf = await config.readConfig(testDir)
  t.is(conf.token, 'bar')
  t.true(conf.china)
  t.true(conf.sandbox)
  t.false(conf.hello)
  t.is(conf.hi, undefined)
})

test('should initConfig', async t => {
  let testDir = getTestDir()
  await config.initConfig(testDir)

  let conf = await config.readConfig(testDir)
  t.is(conf.token, 'Your developer token')
  t.true(conf.china)
  t.false(conf.sandbox)
  t.is(conf.highlight, 'github')

  testDir = `${testDir}${path.sep}`
  await config.initConfig(testDir)

  conf = await config.readConfig(testDir)
  t.is(conf.token, 'Your developer token')
  t.true(conf.china)
  t.false(conf.sandbox)
  t.is(conf.highlight, 'github')
})
