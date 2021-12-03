const argv = process.argv

describe('webapp', () => {
  const log = console.log
  beforeEach(() => {
    console.log = jest.fn()
  })
  afterAll(() => {
    console.log = log
  })
  it('unkown script', async () => {
    argv.splice(2, argv.length - 2, 'unknown')
    require(require.resolve('../bin/webapp'))
    expect(console.log).toHaveBeenCalledWith('Unknown script "unknown".')
  })
})
