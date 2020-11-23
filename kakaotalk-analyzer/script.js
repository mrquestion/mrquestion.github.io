$.extend({
  $: name => $(document.createElement(name)),
  alert: (level, strong, text, timeout) => {
    const alert = $.$('div').addClass(`alert alert-${level} alert-dismissible fade show`)
      .append($.$('strong').text(strong))
      .append(` ${text}`)
      .append(
        $.$('button').addClass('close')
          .append($.$('span').html('&times;'))
      );
    alert.alert();
    $('#alerts').prepend(alert);
    setTimeout(() => alert.alert('close'), timeout);
  },
});

const charts = {};

$(window).on('load', e => {
  moment.locale('ko');

  const inputFileLabel = $('#input-file').siblings('.custom-file-label');
  const defaultLabelText = inputFileLabel.text();
  $('#input-file').on('change', e => {
    const { files } = e.currentTarget;
    if (files.length > 0) {
      const file = Array.from(files).shift();
      let { name, size } = file;
      const units = [ 'B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB' ];
      const length = Math.floor(Math.log(size) / Math.log(1024));
      size /= 1024 ** length;
      size = parseFloat(size.toFixed(2));
      const unit = units[length];
      inputFileLabel.text(`${name} (${size}${unit})`);
      $('#button-analyze').removeAttr('disabled');
    } else {
      inputFileLabel.text(defaultLabelText);
      $('#button-analyze').attr('disabled', '');
    }
  });

  $('#button-analyze').on('click', e => {
    const { files } = document.getElementById('input-file');
    if (files.length > 0) {
      const file = Array.from(files).shift();

      const fileReader= new FileReader();
      $(fileReader).on('load', e => {
        const { result } = e.currentTarget;

        if (typeof Worker !== 'undefined') {
          const worker = new Worker('worker.js');

          const chat = {};

          worker.addEventListener('message', e => {
            const { type, response } = e.data;

            if (type === 'start') {
              const { lines } = response;
              chat.lines = lines;
              chat.messages = [];

              $.alert('info', '⌛ 분석 중', `${lines} 줄의 대화 내용을 분석 중입니다...`, 3000);
            } else if (type === 'next') {
              chat.messages = [ ...chat.messages, ...response.messages ];

              const percentage = chat.messages.length / chat.lines * 100;
              if (!$('#progress-analyze').hasClass('show')) {
                $('#progress-analyze').addClass('show');
              }
              $('#progress-bar-analyze').css({ width: `${percentage}%` }).text(`${parseFloat(percentage.toFixed(2))}%`);
            } else if (type === 'finish') {
              $('#progress-bar-analyze').css({ width: '100%' }).text('100%');
              setTimeout(() => $('#progress-analyze').removeClass('show'), 1000);

              const { metadata } = response;
              const { title } = metadata;
              $.alert('success', '✅ 분석 완료', '완료했습니다!', 3000);

              const counts = _.chain(chat.messages)
                .countBy(message => message.name)
                .entries()
                .sortBy(([ name, count ]) => count)
                .reverse()
                .take(20)
                .map(([ name, count ]) => ({ name, count }))
                .keyBy('name')
                .mapValues('count')
                .value();
              console.log(counts)
              const countByNameCanvas = document.getElementById('chart-count-by-name');
              $(countByNameCanvas).attr({
                width: $(countByNameCanvas).parent().width(),
                height: 600,
              });
              console.log(_.chain()
              .range(counts.length)
              .map(i => `#${parseInt(Math.random() * 0xFFFFFF).toString(16)}`)
              .value())
              charts.countByName = new Chart(
                countByNameCanvas.getContext('2d'),
                {
                  type: 'doughnut',
                  data: {
                    labels: _.entries(counts).map(([ k, v ]) => `${k}: ${v}`),
                    datasets: [
                      {
                        data: _.values(counts),
                        backgroundColor: _.chain()
                          .range(_.keys(counts).length)
                          .map(i => `#${parseInt(Math.random() * 0xFFFFFF).toString(16)}`)
                          .value(),
                      },
                    ],
                  },
                  options: {
                    responsive: true,
                    legend: {
                      position: 'left',
                    },
                    title: {
                      display: true,
                      text: title,
                    },
                    animation: {
                      animateScale: true,
                      animateRoate: true,
                    },
                  },
                },
              );
            }
          });

          worker.postMessage({ type: 'analyze', data: result });
        } else {
          $.alert('danger', '❌ Worker 를 지원하지 않습니다!', '다른 브라우저에서 시도해주세요.', 3000);
        }
      });
      fileReader.readAsText(file);
    } else {
      $.alert('warning', '⚠️ 파일을 선택하지 않았습니다!', '파일을 선택해주세요.', 3000);
    }
  });
});
