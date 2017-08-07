import {ILogger} from "../logging/Interfaces";
import {BaseDialog} from "./BaseDialog";
import {Session, ThumbnailCard, CardImage, Message} from "botbuilder/lib/botbuilder";
import {InvalidOperationException} from "../Errors";
import {IBotService} from "../services/Interfaces";
import {SessionUtils} from "../utils/SessionUtils";

export class RemoveDialog extends BaseDialog {
  private _botService : IBotService;

  constructor(botService: IBotService, triggerRegExp: RegExp, logger: ILogger) {
    super(triggerRegExp, logger);
    this._botService = botService;
  }

  protected async performAction(session: Session, args?: any): Promise<void> {
    const incomingMessage = session.message.text || "";
    const match = this._triggerRegExp.exec(incomingMessage);
    if (!match) {
      this._logger.error(`Failed to extract bot name from deregister message.  message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }

    const teamId = SessionUtils.extractTeamId(session);
    if (!teamId) {
      session.send("cannot_extract_team_id");
      return;
    }
    const botName = match[1];
    const bot = await this._botService.deregisterBotWithName(teamId, botName);
    if (!bot) {
      session.send("bot_not_found", botName);
      return;
    }

    this._logger.info(`Removed bot named '${bot.name}' from team '${bot.teamId}'`);

    const botCard = new ThumbnailCard(session)
      .title("bot_deregistered_title", bot.name)
      .text("bot_deregistered_text")
      .images([
        new CardImage(session)
          .url(`${bot.thumbnailImageUri()}`)
          .alt("bot_avatar_alt_text")
      ]);
    const message = new Message(session).addAttachment(botCard);
    session.send(message);
  }
}