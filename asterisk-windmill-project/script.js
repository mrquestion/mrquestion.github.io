!(((g = {}) => {
  const windowLoaded = e => {
    windowResized();

    _.assign(g, {
      playing: true,
      spinning: true,
      n: 11,
      c: 4,
      shape: 'square',
      fps: 1000 / 60,
      colors: [],
      randomColor: () => {
        const r = 0x7f + _.random(0x80);
        const g = 0x7f + _.random(0x80);
        const b = 0x7f + _.random(0x80);
        return { r, g, b };
      },
    });

    $('#play').on('click', e => g.playing = !g.playing);
    $('#spin').on('click', e => g.spinning = !g.spinning);
    $('#number').val(g.n).on('change', e => g.n = _.toNumber(e.currentTarget.value));
    $('#count').val(g.c).on('change', e => g.c = _.toNumber(e.currentTarget.value));
    $('.shape').on('change', e => g.shape = e.currentTarget.value);

    setTimeout(update);
  };
  const windowResized = e => {
    const width = $(window).width();
    const height = $(window).height();
    _.assign(g, { width, height });
    $('#canvas').attr({ width, height });
  };
  $(window)
    .on('load', windowLoaded)
    .on('resize', windowResized);

  const d2r = d => d / 360 * 2 * Math.PI;
  const r2d = r => r * 360 / (2 * Math.PI);

  const drawCircle = (context, x, y, r, color) => {
    context.beginPath();
    context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
    context.closePath();
  };
  const drawText = (context, x, y, text, color) => {
    context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
    context.fillText(text, x, y);
  };
  const drawAsterisk = (context, x, y, size, color) => {
    context.beginPath();
    context.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
    context.lineWidth = size / 10;
    context.moveTo(x - size / 3, y);
    context.lineTo(x + size / 3, y);
    context.moveTo(x - size / 6, y - size / 3);
    context.lineTo(x + size / 6, y + size / 3);
    context.moveTo(x + size / 6, y - size / 3);
    context.lineTo(x - size / 6, y + size / 3);
    context.stroke();
    context.closePath();
  };

  const update = (d = 0) => {
    const { playing, spinning, n, c, shape, fps, colors, randomColor } = g;
    $('#play').text(playing ? '||' : '|>');
    if (spinning) {
      $('#spin').css({ transform: `rotate(${d}deg)` });
    }
    $('#current-number').text(n);
    $('#current-count').text(c);
    $('#current-degree').text(d);

    while (colors.length !== c) {
      if (colors.length > c) {
        colors.pop();
      } else {
        colors.push(randomColor());
      }
    }

    if (playing) {
      const { width, height } = g;
      const canvas = document.getElementById('canvas');
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, width, height);

      const length = Math.min(width, height);
      const dx = width > height ? (width - length) / 2 : 0;
      const dy = height > width ? (height - length) / 2 : 0;
      const size = length / n;
      const angle = 360 / (c * 2);
      for (let j of _.range(n)) {
        for (let i of _.range(n)) {
          const x = i - n / 2 + .5;
          const y = -(j - n / 2 + .5);
          const l = Math.sqrt(x * x + y * y);
          if (l > 0) {
            const cos = x / l;
            const r = Math.acos(cos);
            let d0 = _.round(r2d(r), 6);
            if (y < 0) {
              d0 = 360 - d0;
            }
            d0 = (d0 + d) % 360;
            for (let k of _.range(c * 2)) {
              const d1 = (angle * k) % 360;
              const d2 = (angle * (k + 1)) % 360;
              if (d1 <= d0 && d0 <= d2 && k % 2 === 0) {
                if (shape === 'square' || (shape === 'circle' && l < n / 2)) {
                  const x = dx + i * size + size / 2;
                  const y = dy + j * size + size / 2;
                  const color = colors[_.toInteger(k / 2)];
                  // drawCircle(context, x, y, size / 2, color);
                  drawAsterisk(context, x, y, size, color);
                }
                break;
              }
            }
          } else {
            const x = dx + i * size + size / 2;
            const y = dy + j * size + size / 2;
            // drawCircle(context, x, y, size / 2, { r: 0, g: 0, b: 0 });
            drawAsterisk(context, x, y, size, { r: 0, g: 0, b: 0 });
          }
        }
      }

      if (spinning) {
        d = (d + 1) % 360;
      }
    }

    setTimeout(update, fps, d);
  };
})());
