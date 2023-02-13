import { Model, Sequelize } from "../../Database/sequelize.js";

const LaunchToken = Model.define("launch_tokens", {
  id: {
    type: Sequelize.BIGINT(20),
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  symbol: Sequelize.STRING,
  name: Sequelize.STRING,
  status: Sequelize.STRING,
  active_status: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    comment: "1=Active , 0=Not Active"
  },
  image: {
    type: Sequelize.STRING,
    get() {
      return process.env.BASE_URL + "image/launchpad/" + this.getDataValue('image')
    }
  },
  total_limits: Sequelize.INTEGER,  
  verification_score: {
    type: Sequelize.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  total_score: {
    type: Sequelize.INTEGER,
    defaultValue: 5,
    allowNull: false,
  },
  
  hash_tags: {
    type: Sequelize.TEXT,
    defaultValue: null,
    set(value) {
     (value) ? this.setDataValue('hash_tags', JSON.stringify(value)) : [];
    },
    get() {
      const rawValue = this.getDataValue('hash_tags');
      return (rawValue != "" && rawValue != null) ? JSON.parse(rawValue) : [];
    }
  },
  token_url: Sequelize.STRING,
  social_media_link: {
    type: Sequelize.TEXT,
    defaultValue: '',
    allowNull: false,
    set(value4) {
      this.setDataValue('social_media_link', JSON.stringify(value4));
    },
    get() {
      return JSON.parse(this.getDataValue('social_media_link'));
    }

  },
  video_link: Sequelize.STRING,
  project_summary: {
    type: Sequelize.TEXT,
    defaultValue: '',
    allowNull: false,
    set(value4) {
      this.setDataValue('project_summary', JSON.stringify(value4));
    },
    get() {
      return JSON.parse(this.getDataValue('project_summary'));
    }

  },
  whitepaper_link: {
    type: Sequelize.STRING,
    get() {
      return process.env.BASE_URL + "image/launchpad/" + this.getDataValue('whitepaper_link');
    }
  },
  token_economics: {
    type: Sequelize.TEXT,
    defaultValue: '',
    set(value4) {
      this.setDataValue('token_economics', JSON.stringify(value4));
    },
    get() {
      return JSON.parse(this.getDataValue('token_economics'));
    }
  },
  token_allocation: {
    type: Sequelize.TEXT,
    defaultValue: '',
    set(value4) {
      this.setDataValue('token_allocation', JSON.stringify(value4));
    },
    get() {
      return JSON.parse(this.getDataValue('token_allocation'));
    }
  },
  company_highlight: {
    type: Sequelize.TEXT,
    defaultValue: '',
    set(value4) {
      this.setDataValue('company_highlight', JSON.stringify(value4));
    },
    get() {
      return JSON.parse(this.getDataValue('company_highlight'));
    }
  },
  use_of_funds: {
    type: Sequelize.TEXT,
    defaultValue: '',
    set(value4) {
      this.setDataValue('use_of_funds', JSON.stringify(value4));
    },
    get() {
      return JSON.parse(this.getDataValue('use_of_funds'));
    }

  },
  fund_raising: {
    type: Sequelize.TEXT,
    defaultValue: '',
    set(value4) {
      this.setDataValue('fund_raising', JSON.stringify(value4));
    },
    get() {
      return JSON.parse(this.getDataValue('fund_raising'));
    }

  },
  partnerships: {
    type: Sequelize.TEXT,
    defaultValue: '',
    set(value4) {
      (value4) ? this.setDataValue('partnerships', JSON.stringify(value4)) : [];
    },
    get() {
      const rawValue = this.getDataValue('partnerships');
      return (rawValue != "" && rawValue != null) ? JSON.parse(rawValue) : [];
    }
  },
  gallery: {
    type: Sequelize.STRING,
    defaultValue: '',
    set(value4) {
      this.setDataValue('gallery', JSON.stringify(value4));
    },
    get() {
      const rawValue = this.getDataValue('gallery');
      let d = [];

      JSON.parse(rawValue).forEach(function (value, index) {
        d.push(process.env.BASE_URL + "image/launchpad/" + value)
      });
      return (rawValue != "" && rawValue != null) ? d : [];
    }
  },
  disclaimer: {
    type: Sequelize.TEXT,
    defaultValue: '',
    set(value4) {
      this.setDataValue('disclaimer', JSON.stringify(value4));
    },
    get() {
      return JSON.parse(this.getDataValue('disclaimer'));
    }
  },
  started_at: Sequelize.DATEONLY,
  expired_at: Sequelize.DATEONLY,
});


await LaunchToken.sync();
export default LaunchToken;