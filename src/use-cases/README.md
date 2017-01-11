Пример конфигурирования вариантов использования в inspiration-center
=

Cоздаем файл с названием варианта использования, например, example.yml.

Содержимое файла:
```
title: Create agile boards
description: User story maps, kanban boards and retrospectives.
image: agile.png
visible: true
demoBoards:
  # Kanban Demo Board
  - iXjVOf1y2y8=
templates:
  # User Story Map
  - iXjVOf4wS_w=
  # Template
  - iXjVOf1o8dY=
videos:
  # Video from Vimeo
  - https://vimeo.com/106236408
  # Video from Youtube
  - https://www.youtube.com/watch?v=Ti2g66b7MUo
helpTopics:
  - https://help.realtimeboard.com/solution/articles/11000008278-achieve-goals-with-distributed-agile-teams
blogArticles:
  - https://realtimeboard.com/blog/building-product-roadmap-template/#.WFKSLXV97CI
```

Примечание
-
- image - название файла с иконкой, которая будет отображаться для этого раздела inspiration-center.
- visible - необязательное поле. Если значение = `false`, то раздел не будет отображаться в списке основных use cases.
Но его можно будет открыть, каким-нибудь другим действием, например, попав в приложение с какой-нибудь страницы сайта.
- videos - ссылки на видео контент. Пока поддерживаются только видео с Youtube и Vimeo.
- templates - ссылки на доски, на базе которых созданы темплейты. Считаем, что один каждая доска учавствует только в одном темплейте. Иначе будет выбран случайный из подходящих.
- символы `#` используются в качестве комментариев, для удобства и не влияют на конечную конфигурацию.