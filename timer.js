function Timer () {
  var timeline = {};

  var startTime;

  this.mark0 = (key) => {
    if (!startTime)
      startTime = Date.now();
    timeline[key] = Date.now() - startTime;
  };

  this.mark = (key) => {
    if (!startTime) {
      startTime = process.hrtime();
      timeline[key] = 0;
      return;
    }
    var diff = process.hrtime(startTime);
    timeline[key] = diff[0] * 1000 + diff[1] / 1e6;
  };

  this.stats = function stats() {
    var result = {timeline};
    return result;
  };
}

module.exports = Timer;
