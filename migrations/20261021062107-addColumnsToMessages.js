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
    await queryInterface.addColumn('Messages', 'mediaKey', {
      type: Sequelize.STRING(1024),
      allowNull: true
    })

    await queryInterface.addColumn('Messages', 'mediaName', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.addColumn('Messages', 'mediaType', {
      type: Sequelize.STRING,
      allowNull: true
    })

    await queryInterface.addColumn('Messages', 'mediaSize', {
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

    await queryInterface.removeColumn('Messages','mediaKey');
    await queryInterface.removeColumn('Messages','mediaName');
    await queryInterface.removeColumn('Messages','mediaType');
    await queryInterface.removeColumn('Messages','mediaSize');

  }
};
