
describe('Test distinctSenders', function () {
  setGlobal('utils', require('../utils')(lib));
  it('Naive', function () {
    expect(utils.distinctSenders([{
      from: 'luka',
      from_role: 'boat'
    }])).to.deep.equal([{
      from: 'luka',
      from_role: 'boat',
      from_realm: null,
      messages: []
    }]);
  });
  it('Extra input prop', function () {
    expect(utils.distinctSenders([{
      from: 'luka',
      from_role: 'boat',
      message: 'blah'
    }])).to.deep.equal([{
      from: 'luka',
      from_role: 'boat',
      from_realm: null,
      messages: [{
        message: 'blah'
      }]
    }]);
  });
  it('2 chats, same sender', function () {
    expect(utils.distinctSenders([{
      from: 'luka',
      from_role: 'boat',
      from_realm: 'eu',
      message: 'blah',
      seen: true
    },{
      from: 'luka',
      from_role: 'boat',
      from_realm: 'eu',
      message: 'hah'
    }])).to.deep.equal([{
      from: 'luka',
      from_role: 'boat',
      from_realm: 'eu',
      messages: [{
        message: 'blah',
        seen: true
      },{
        message: 'hah'
      }]
    }]);
  });
  it('2 chats, 2 senders', function () {
    expect(utils.distinctSenders([{
      from: 'luka',
      from_role: 'boat',
      message: 'blah'
    },{
      from: 'ra',
      from_role: 'boat',
      message: 'hah'
    }])).to.deep.equal([{
      from: 'luka',
      from_role: 'boat',
      from_realm: null,
      messages: [{
        message: 'blah'
      }]
    },{
      from: 'ra',
      from_role: 'boat',
      from_realm: null,
      messages: [{
        message: 'hah'
      }]
    }]);
  });
  it('5 chats, 2 senders', function () {
    expect(utils.distinctSenders([{
      from: 'luka',
      from_role: 'boat',
      message: 'blah'
    },{
      from: 'ra',
      from_role: 'boat',
      message: '4321'
    },{
      from: 'ra',
      from_role: 'boat',
      message: '1234'
    },{
      from: 'luka',
      from_role: 'boat',
      message: '7890'
    },{
      from: 'ra',
      from_role: 'boat',
      message: 'hah'
    }])).to.deep.equal([{
      from: 'luka',
      from_role: 'boat',
      from_realm: null,
      messages: [{
        message: 'blah'
      },{
        message: '7890'
      }]
    },{
      from: 'ra',
      from_role: 'boat',
      from_realm: null,
      messages: [{
        message: '4321'
      },{
        message: '1234'
      },{
        message: 'hah'
      }]
    }]);
  });
});
