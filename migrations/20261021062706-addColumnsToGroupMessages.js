'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.addColumn('GroupMessages', 'mediaKey', {
      type: Sequelize.STRING(1024),
      allowNull: true
    })

    await queryInterface.addColumn('GroupMessages', 'mediaName', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.addColumn('GroupMessages', 'mediaType', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.addColumn('GroupMessages', 'mediaSize', {
      type: Sequelize.STRING,
      allowNull: true
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('GroupMessages','mediaKey');
    await queryInterface.removeColumn('GroupMessages','mediaName');
    await queryInterface.removeColumn('GroupMessages','mediaType');
    await queryInterface.removeColumn('GroupMessages','mediaSize');
  }
};
