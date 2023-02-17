import { AnyWASocket, delay, WAMessage } from "@adiwajshing/baileys";
import { Store } from "../../libs/store";
import Queue from "../../models/Queue";
import QueueOption from "../../models/QueueOption";
import Ticket from "../../models/Ticket";
import { getMessageOptions } from "./SendWhatsAppMedia";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import { VerifyQueue } from "./VerifyQueue";
import { isNil, head, chunk } from "lodash";
import path from "path";

type Session = AnyWASocket & {
  id?: number;
  store?: Store;
};

export async function HandleChatbot(
  ticket: Ticket,
  msg: WAMessage,
  wbot: Session,
  dontReadTheFirstQuestion: boolean = false
) {
  const queue = await Queue.findByPk(ticket.queueId, {
    include: [
      {
        model: QueueOption,
        as: "options",
        where: { parentId: null },
        order: [
          ["option", "ASC"],
          ["createdAt", "ASC"]
        ]
      }
    ]
  });

  const receivedOption =
    msg?.message?.buttonsResponseMessage?.selectedButtonId ||
    msg?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.message?.conversation;

  const selectedButtonId = `${receivedOption}`;

  if (selectedButtonId == "00") {
    // voltar para o menu inicial
    await ticket.update({ queueOptionId: null, chatbot: false, queueId: null });
    await VerifyQueue(wbot, msg, ticket, ticket.contact);
    return;
  }

  if (
    !isNil(queue) &&
    !isNil(ticket.queueOptionId) &&
    selectedButtonId == "#"
  ) {
    // falar com atendente
    await UpdateTicketService({
      ticketData: { queueOptionId: null, chatbot: false },
      ticketId: ticket.id,
      companyId: ticket.companyId
    });
    await wbot.sendMessage(
      `${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`,
      {
        text: "\u200eAguarde, você será atendido em instantes."
      }
    );

    return;
  } else if (
    !isNil(queue) &&
    !isNil(ticket.queueOptionId) &&
    selectedButtonId == "0"
  ) {
    // voltar para o menu anterior
    const option = await QueueOption.findByPk(ticket.queueOptionId);
    await ticket.update({ queueOptionId: option?.parentId });
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    // escolheu uma opção
    const count = await QueueOption.count({
      where: { parentId: ticket.queueOptionId }
    });
    let option: any = {};
    if (count == 1) {
      option = await QueueOption.findOne({
        where: { parentId: ticket.queueOptionId }
      });
    } else {
      option = await QueueOption.findOne({
        where: {
          option: selectedButtonId,
          parentId: ticket.queueOptionId
        }
      });
    }
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  } else if (
    !isNil(queue) &&
    isNil(ticket.queueOptionId) &&
    !dontReadTheFirstQuestion
  ) {
    // não linha a primeira pergunta
    const option = queue?.options.find(o => o.id == +selectedButtonId);
    if (option) {
      await ticket.update({ queueOptionId: option?.id });
    }
  }

  await ticket.reload();

  if (!isNil(queue) && isNil(ticket.queueOptionId)) {
    const queueOptionList = await QueueOption.findAll({
      where: { queueId: ticket.queueId, parentId: null },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"]
      ]
    });

    const listMessage = {
      text: "",
      footer: "",
      title: "Atendimento",
      buttonText: "Opções disponíveis",
      sections: [
        {
          title: "Escolha uma das opções",
          rows: []
        }
      ]
    };

    let textList = "Atendimento\n\n";

    let groupIndex = 0;
    for (let queueOptions of chunk(queueOptionList, 3)) {
      const buttons = [];
      const buttonMessage = {
        text: "Escolha uma opção",
        footer: "",
        buttons: [],
        headerType: 1
      };

      buttonMessage.text = queue.greetingMessage || "Escolha uma opção";
      listMessage.text = queue.greetingMessage || "Escolha uma opção";
      listMessage.footer = queue.name;

      queueOptions.forEach((option, i) => {
        buttons.push({
          buttonId: option?.id,
          buttonText: { displayText: option.title },
          type: 1
        });
        listMessage.sections[0].rows.push({
          rowId: option?.id,
          title: option?.title
        });
        textList += `${option.option} - ${option.title}\n`;
      });

      if (queue.optionType === "BUTTON_LIST") {
        buttonMessage.buttons = buttons;
        if (groupIndex !== 0) {
          buttonMessage.text = "Mais opções👇";
        }
        await wbot.sendMessage(
          `${ticket.contact.number}@${
            ticket.isGroup ? "g.us" : "s.whatsapp.net"
          }`,
          buttonMessage
        );
      }

      groupIndex++;
    }

    if (queue.optionType === "OPTION_LIST") {
      await wbot.sendMessage(
        `${ticket.contact.number}@${
          ticket.isGroup ? "g.us" : "s.whatsapp.net"
        }`,
        listMessage
      );
    }

    if (queue.optionType === "TEXT_LIST") {
      await wbot.sendMessage(
        `${ticket.contact.number}@${
          ticket.isGroup ? "g.us" : "s.whatsapp.net"
        }`,
        {
          text: textList
        }
      );
    }
  } else if (!isNil(queue) && !isNil(ticket.queueOptionId)) {
    const currentOption = await QueueOption.findByPk(ticket.queueOptionId);
    const queueOptionList = await QueueOption.findAll({
      where: { parentId: ticket.queueOptionId },
      order: [
        ["option", "ASC"],
        ["createdAt", "ASC"]
      ]
    });

    const listMessage = {
      text: "",
      footer: "",
      title: "Atendimento",
      buttonText: "Opções disponíveis",
      sections: [
        {
          title: "Escolha uma das opções",
          rows: []
        }
      ]
    };

    let textList = `${currentOption.title}\n\n`;

    let groupIndex = 0;
    for (let queueOptions of chunk(queueOptionList, 3)) {
      const buttons = [];
      const buttonMessage = {
        text: "Escolha uma opção",
        footer: "",
        buttons: [],
        headerType: 1
      };

      buttonMessage.footer = queue.name;

      listMessage.title = currentOption.title || "Atendimento";
      listMessage.text =
        currentOption.message || "Escolha uma das opções no botão abaixo";
      listMessage.footer = queue.name;

      if (currentOption.path !== null && currentOption.path !== "") {
        const filePath = path.resolve(
          __dirname,
          "..",
          "..",
          "..",
          "public",
          currentOption.path
        );
        const options = await getMessageOptions(currentOption.path, filePath);
        await wbot.sendMessage(
          `${ticket.contact.number}@${
            ticket.isGroup ? "g.us" : "s.whatsapp.net"
          }`,
          { ...options }
        );
      }

      if (queueOptions.length > 1) {
        if (!isNil(currentOption?.message) && currentOption?.message !== "") {
          buttonMessage.text = `${currentOption.title}\n\n`;
          buttonMessage.text += `${currentOption.message}`;
          buttonMessage.footer = queue.name;
        }

        queueOptions.forEach(option => {
          buttons.push({
            buttonId: option?.option,
            buttonText: { displayText: option.title },
            type: 1
          });
          listMessage.sections[0].rows.push({
            rowId: option?.option,
            title: option?.title
          });
          textList += `${option.option} - ${option.title}\n`;
        });
      } else if (queueOptions.length == 1) {
        const firstOption = head(queueOptions);
        if (firstOption) {
          await wbot.sendMessage(
            `${ticket.contact.number}@${
              ticket.isGroup ? "g.us" : "s.whatsapp.net"
            }`,
            {
              text: firstOption.message || firstOption.title
            }
          );
        }

        if (firstOption.finalize) {
          await UpdateTicketService({
            ticketData: { status: "closed" },
            ticketId: ticket.id,
            companyId: ticket.companyId
          });
          return;
        }
      }

      await delay(1000);

      if (currentOption?.optionType === "BUTTON_LIST") {
        buttonMessage.buttons = buttons;
        if (buttonMessage.buttons.length > 0) {
          if (groupIndex !== 0) {
            buttonMessage.text = "Mais opções👇";
          }
          await wbot.sendMessage(
            `${ticket.contact.number}@${
              ticket.isGroup ? "g.us" : "s.whatsapp.net"
            }`,
            buttonMessage
          );
        }
      }

      groupIndex++;
    }

    if (currentOption?.optionType === "OPTION_LIST") {
      if (
        listMessage.sections.length > 0 &&
        listMessage.sections[0].rows.length > 0 &&
        listMessage.sections[0].rows.length > 0
      ) {
        await wbot.sendMessage(
          `${ticket.contact.number}@${
            ticket.isGroup ? "g.us" : "s.whatsapp.net"
          }`,
          listMessage
        );
      }
    }

    if (queue.optionType === "TEXT_LIST" && queueOptionList.length > 1) {
      await wbot.sendMessage(
        `${ticket.contact.number}@${
          ticket.isGroup ? "g.us" : "s.whatsapp.net"
        }`,
        {
          text: textList
        }
      );
    }

    if (queueOptionList.length == 0) {
      await wbot.sendMessage(
        `${ticket.contact.number}@${
          ticket.isGroup ? "g.us" : "s.whatsapp.net"
        }`,
        { text: currentOption.message || currentOption.title }
      );
    }

    if (currentOption.finalize) {
      await UpdateTicketService({
        ticketData: { status: "closed" },
        ticketId: ticket.id,
        companyId: ticket.companyId
      });
      return;
    }

    if (queue.optionType === "TEXT_LIST") {
      let opcoesFinais = "Outras Opções \n\n";

      opcoesFinais += "0 - Voltar\n";
      opcoesFinais += "00 - Menu inicial\n";

      if (queueOptionList.length <= 1) {
        opcoesFinais += "# - Falar com o atendente\n";
      }

      await wbot.sendMessage(
        `${ticket.contact.number}@${
          ticket.isGroup ? "g.us" : "s.whatsapp.net"
        }`,
        {
          text: opcoesFinais
        }
      );
    } else {
      const opcoesFinais = {
        text: "\u200cOutras Opções",
        footer: "",
        buttons: [
          {
            buttonId: `0`,
            buttonText: { displayText: "Voltar" },
            type: 1
          },
          {
            buttonId: `00`,
            buttonText: { displayText: "Menu inicial" },
            type: 1
          }
        ],
        headerType: 1
      };

      if (queueOptionList.length <= 1) {
        opcoesFinais.buttons.push({
          buttonId: `#`,
          buttonText: { displayText: "Falar com o atendente" },
          type: 1
        });
      }

      await wbot.sendMessage(
        `${ticket.contact.number}@${
          ticket.isGroup ? "g.us" : "s.whatsapp.net"
        }`,
        opcoesFinais
      );
    }
  }
}
